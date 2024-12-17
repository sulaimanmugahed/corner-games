const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false,
});

async function checkDatabaseExists()
{
    try
    {
        await sequelize.authenticate();
        console.log('Database connected or created successfully.');
    } catch (error)
    {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

checkDatabaseExists();

module.exports = {
    sequelize,
    syncOptions: { alter: true },
};
