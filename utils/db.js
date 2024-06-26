import { MongoClient, ObjectId } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const uri = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    this.client.connect((err) => {
      if (err) {
        console.error('Connection to MongoDB failed:', err);
      } else {
        console.log('Connection to MongoDB successful');
      }
    });
  }

  isAlive() {
    return !!this.client && this.client.isConnected();
  }

  async nbUsers() {
    const usersCollection = this.client.db().collection('users');
    const count = await usersCollection.countDocuments();
    return count;
  }

  async nbFiles() {
    const filesCollection = this.client.db().collection('files');
    const count = await filesCollection.countDocuments();
    return count;
  }

  async getFileById(id) {
    const filesCollection = this.client.db().collection('files');
    const file = await filesCollection.findOne({ _id: new ObjectId(id) });
    return file;
  }

  async getFilesByParentId(parentId, page = 0) {
    const filesCollection = this.client.db().collection('files');
    const files = await filesCollection
      .find({ parentId })
      .skip(page * 20)
      .limit(20)
      .toArray();
    return files;
  }
}

const dbClient = new DBClient();

export default dbClient;
