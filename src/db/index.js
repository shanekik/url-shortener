const Sequelize = require('sequelize');
const Op = Sequelize.Op;

class DB {
  constructor() {
    this.sequelize = new Sequelize('urlshortener', 'gvozden', '', {
      host: 'localhost',
      dialect: 'postgres',
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
      operatorsAliases: false
    });

    this.Urls = this.sequelize.define(
      'urls',
      {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        url: { type: Sequelize.STRING, allowNull: false },
        alias: { type: Sequelize.STRING, allowNull: false },
        visits: { type: Sequelize.INTEGER, defaultValue: 0 },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)')
        }
      },
      {
        indexes: [
          { unique: true, fields: ['url', 'alias'] },
          {
            name: 'url_alias_index',
            method: 'BTREE',
            fields: ['url', 'alias']
          },
          {
            name: 'alias_index',
            method: 'BTREE',
            fields: ['alias']
          }
        ],
        timestamps: false,
        tableName: 'urls'
      }
    );
  }

  init() {
    return this.sequelize.sync();
  }

  async addUrl(url, alias) {
    // find first
    try {
      // check if url already exists in the db
      // we do have unique constraint on both fields but I would rather check
      // and not throw errors on existing values
      const exists = await this.Urls.findAndCountAll({
        where: {
          [Op.or]: [
            {
              url: url
            },
            {
              alias: alias
            }
          ]
        },
        limit: 2
      });

      const found = exists.count;

      // url and alias do not exist in database
      console.log('exists', exists.count);
      if (found == 2) {
        // both url and alias exist in database
        return { error: 'URL and alias exist in database' };
      } else if (found == 1) {
        // chec if url or alias is issue
        if (exists.rows[0].url == url) {
          return { error: 'URL already exists in database' };
        } else {
          return { error: 'Alias already exists in database' };
        }
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  generateSlug(url) {
    // generate a slug for url
  }
}

export default DB;
