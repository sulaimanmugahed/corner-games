const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, null, null, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
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
