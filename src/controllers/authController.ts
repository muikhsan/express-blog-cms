import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { sanitizeUser, sanitizeUsers, sanitizeUserMinimal } from '../utils/sanitizers';
import { AuthRequest, AuthResponse, StandardResponse, SanitizedUser, SanitizedUserMinimal } from '../types';
import { addToBlacklist } from '../utils/tokenBlacklist';

export const register = async (req: Request, res: Response<AuthResponse | StandardResponse>): Promise<void> => {
  try {
    const { name, username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    const user = new User({ name, username, password });
    await user.save();

    const token = generateToken(user._id);

    const response: AuthResponse = {
      message: 'User created successfully',
      token,
      user: sanitizeUser(user)
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response<AuthResponse | StandardResponse>): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id);

    const response: AuthResponse = {
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (req: Request, res: Response<StandardResponse>): Promise<void> => {
  try {
    const token = req.header('Authorization');

    if (token) {
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      await addToBlacklist(cleanToken);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUsers = async (req: Request, res: Response<SanitizedUser[] | StandardResponse>): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.json(sanitizeUsers(users));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUser = async (req: Request, res: Response<SanitizedUser | SanitizedUserMinimal | StandardResponse>): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const authReq = req as AuthRequest;
    const isOwnProfile = authReq.user && authReq.user._id.toString() === req.params.id;

    if (isOwnProfile) {
      res.json(sanitizeUser(user));
    } else {
      res.json(sanitizeUserMinimal(user));
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response<StandardResponse<{ user: SanitizedUser }>>): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, username } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { name, username },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User updated successfully', data: { user: sanitizeUser(user) } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response<StandardResponse>): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
