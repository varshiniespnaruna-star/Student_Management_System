import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, requireAuth } from '../auth.js';

export const authRouter = Router();

// POST /api/v1/auth/login
authRouter.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (user.status === 'inactive') {
    res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken(user);

  // Set secure cookie as well
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Get profile depending on role
  let profile = null;
  if (user.role === 'student') {
    profile = db.getStudentProfileByUserId(user.id);
  } else if (user.role === 'teacher') {
    profile = db.getTeacherProfileByUserId(user.id);
  }

  db.logAudit({
    user_id: user.id,
    user_email: user.email,
    action: 'USER_LOGIN',
    entity_type: 'AUTH',
    details: `User logged in with role ${user.role}`,
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      phone: user.phone,
      profile,
    },
  });
});

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
  const user = db.findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  let profile = null;
  if (user.role === 'student') {
    profile = db.getStudentProfileByUserId(user.id);
  } else if (user.role === 'teacher') {
    profile = db.getTeacherProfileByUserId(user.id);
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      phone: user.phone,
      status: user.status,
      profile,
    },
  });
});

// POST /api/v1/auth/logout
authRouter.post('/logout', requireAuth, (req: Request, res: Response): void => {
  res.clearCookie('token');
  db.logAudit({
    user_id: req.user!.id,
    user_email: req.user!.email,
    action: 'USER_LOGOUT',
    entity_type: 'AUTH',
    details: 'User logged out',
    ip_address: req.ip || '127.0.0.1',
  });
  res.json({ message: 'Logged out successfully.' });
});

// POST /api/v1/auth/forgot-password
authRouter.post('/forgot-password', (req: Request, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    // Return generic message for privacy, but for convenience include reset token simulation
    res.json({
      message: 'If the email exists in our system, a password reset link has been dispatched.',
    });
    return;
  }

  const resetToken = db.createPasswordResetToken(user.email);

  res.json({
    message: 'If the email exists in our system, a password reset link has been dispatched.',
    dev_reset_token: resetToken,
    dev_note: 'For local testing without mail server, use the dev_reset_token or click the provided test link.',
  });
});

// POST /api/v1/auth/reset-password
authRouter.post('/reset-password', (req: Request, res: Response): void => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token and new password are required.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const email = db.verifyResetToken(token);
  if (!email) {
    res.status(400).json({ error: 'Invalid or expired password reset token.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(newPassword, salt);
  const success = db.consumeResetToken(token, hash);

  if (!success) {
    res.status(400).json({ error: 'Unable to reset password.' });
    return;
  }

  db.logAudit({
    user_email: email,
    action: 'PASSWORD_RESET',
    entity_type: 'AUTH',
    details: 'User password successfully reset via token',
    ip_address: req.ip || '127.0.0.1',
  });

  res.json({ message: 'Password has been reset successfully. You can now log in.' });
});
