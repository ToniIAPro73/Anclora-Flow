const User = require('../models/User');

const DEFAULT_DEV_USER = {
  email: 'demo@anclora.test',
  firstName: 'Demo',
  lastName: 'Anclora',
  company: 'Anclora Labs',
  phone: '+34 600 000 000',
  password: 'Anclora123!',
};

async function ensureDevUser() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const email = process.env.DEMO_USER_EMAIL || DEFAULT_DEV_USER.email;
  const firstName = process.env.DEMO_USER_FIRST_NAME || DEFAULT_DEV_USER.firstName;
  const lastName = process.env.DEMO_USER_LAST_NAME || DEFAULT_DEV_USER.lastName;
  const company = process.env.DEMO_USER_COMPANY || DEFAULT_DEV_USER.company;
  const phone = process.env.DEMO_USER_PHONE || DEFAULT_DEV_USER.phone;
  const password = process.env.DEMO_USER_PASSWORD || DEFAULT_DEV_USER.password;

  let user = await User.findByEmail(email);

  if (!user) {
    await User.create({
      email,
      firstName,
      lastName,
      company,
      phone,
      password,
      authProvider: 'local',
      emailVerifiedAt: new Date(),
    });

    console.log(`🔧 Usuario de desarrollo creado: ${email}`);
    return User.findByEmail(email);
  }

  const needsPassword = !user.password_hash;
  const needsVerification = !user.email_verified_at;
  const displayName = User.mapDisplayName({
    name: user.name,
    firstName: user.first_name || firstName,
    lastName: user.last_name || lastName,
    email,
  });

  const updates = {};
  if (user.name !== displayName) {
    updates.name = displayName;
  }
  if (!user.first_name) {
    updates.firstName = firstName;
  }
  if (!user.last_name) {
    updates.lastName = lastName;
  }
  if (!user.company) {
    updates.company = company;
  }
  if (!user.phone) {
    updates.phone = phone;
  }

  if (Object.keys(updates).length) {
    await User.update(user.id, updates);
  }

  if (needsVerification) {
    await User.markEmailVerified(user.id);
  }

  if (needsPassword) {
    await User.updatePassword(user.id, password);
  }

  return User.findByEmail(email);
}

module.exports = {
  ensureDevUser,
};
