import sha1 from 'sha1';
import dbClient from '../utils/db';

const UsersController = {
  async postNew(email, password) {
    if (!email) {
      throw { statusCode: 400, message: 'Missing email' };
    }
    if (!password) {
      throw { statusCode: 400, message: 'Missing password' };
    }

    // Check if email already exists
    const userExists = await dbClient.client.db().collection('users').findOne({ email });
    if (userExists) {
      throw { statusCode: 400, message: 'Already exist' };
    }

    // Hash password using SHA1
    const hashedPassword = sha1(password);

    // Insert new user into database
    const result = await dbClient.client.db().collection('users').insertOne({
      email,
      password: hashedPassword,
    });

    return { id: result.insertedId, email };
  },
};

export default UsersController;
