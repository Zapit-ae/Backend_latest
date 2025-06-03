# Zappit Backend
This is the backend for the Zappit app, it uses [express.js](https://expressjs.com/) as the server
and [MariaDB](https://mariadb.org/) as the database.

# Prerequisites
- [Node.js](https://nodejs.org/)
- [MariaDB](https://mariadb.org/)

# Getting Started
Run this in your terminal
```sh
npm install
npm run dev
```
This will start the server on port 8080. It will have the address `http://localhost:8080`. (You can change the port in the `server.js` file.)
You should use this address to connect to the server from the app.

> Note: If you are using an Android emulator, instead of `http://localhost:8080`, you should use `http://10.0.2.2:8080`. Read more about this [here](https://developer.android.com/studio/run/emulator-networking#networkaddresses)