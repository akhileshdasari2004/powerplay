import User from '../models/User.js';

class UserRepository {
  async findById(id) {
    return User.findById(id).select('+isActive').lean();
  }

  async findByEmail(email) {
    return User.findOne({ email }).lean();
  }

  async findByEmailWithPassword(email) {
    return User.findOne({ email }).select('+password').lean();
  }

  async findByIdWithRefreshToken(id) {
    return User.findById(id).select('+refreshToken').lean();
  }

  async create(userData) {
    return User.create(userData);
  }

  async updateRefreshToken(userId, refreshToken) {
    return User.findByIdAndUpdate(userId, { refreshToken }, { new: true });
  }

  async clearRefreshToken(userId) {
    return User.findByIdAndUpdate(userId, { refreshToken: null }, { new: true });
  }

  async updatePassword(userId, password) {
    return User.findByIdAndUpdate(
      userId,
      {
        password,
        passwordChangedAt: new Date(),
        refreshToken: null,
      },
      { new: true }
    );
  }

  async existsByEmail(email) {
    const count = await User.countDocuments({ email });
    return count > 0;
  }

  async updateLastLogin(userId) {
    return User.findByIdAndUpdate(userId, { lastLogin: new Date() }, { new: true });
  }
}

export default new UserRepository();