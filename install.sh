#!/bin/bash
checkIfSudo ()
{
	#This makes sure the install script was run with sudo.  It requires root for some actions.  
        if [ "$(whoami)" != 'root' ]
        then
                printf "You forgot sudo..."
                exit 1
        else
                return 0
        fi
}

installNode6 ()
{
	#This installs node 6 using apt https://nodejs.org/en/download/package-manager/
	curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
	apt-get install -y nodejs
	apt-get install -y build-essential
}

installMYSQL ()
{
	apt-get install -y mysql-server
	mysql_secure_installation
	systemctl enable mysql
}

promptNode6Install()
{
	clear
	read -p "Node version 6 is not installed but is required.  Would you like this script to install it for you? Warning this could replace your current version of nodejs with version 6.\n" yn
                case $yn in
                        [Yy]* ) installNode6;;
                        [Nn]* ) exit;;
                * ) printf "Please answer yes to attempt to install node or no to quit.\n";;
        esac
}

checkPrerequisites ()
{
	#Make sure node version 6 and npm are installed.  If not this should ask if you want to install.
	[[ $(node -v) =~ "v6." ]] || promptNode6Install

	#Check for npm just in case	
	command -v npm >/dev/null 2>&1 || { echo >&2 "Npm is not installed.  Please install the npm package and run setup again.  https://nodejs.org/en/download/package-manager/  Aborting."; exit 1; }

	#Check for mysql
	if mysql -V | grep --quiet "Ver" 	
	then
		printf "My SQL is already installed.\n"
	else
		installMYSQL
	fi

	npm install
}

collectInformation ()
{
	#This asks the user a series of questions used to setup the config file.
	clear
	printf "Enter a password for the oil database service account user:\n"
	read databaseServicePassword
	clear
	printf "Enter a password for the database sa account:\n"
        read mySqlPassword
	clear
	printf "Enter a secret used to sign session cookies:\n"
	read cookieSecret
}

createDatabase ()
{
	#This should create the MYSWL database
	mysql -uroot -p${mySqlPassword} -e "CREATE DATABASE OilGaugeWebService;"

	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "CREATE TABLE OilGaugeWebService.roles (id INT NOT NULL AUTO_INCREMENT, roleName varchar(32) NOT NULL UNIQUE, PRIMARY KEY (id));"

	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "CREATE TABLE OilGaugeWebService.users (id INT NOT NULL AUTO_INCREMENT, userName varchar(32) NOT NULL UNIQUE, userEmail varchar(1000) NOT NULL UNIQUE, userSalt varchar(1000) NOT NULL, userPass varchar(1000) NOT NULL, userRole INT NOT NULL, FOREIGN KEY (userRole) REFERENCES roles(id),
PRIMARY KEY (id));"

	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "CREATE TABLE OilGaugeWebService.devices (id INT NOT NULL AUTO_INCREMENT, deviceIdentifier varchar(1000) NOT NULL UNIQUE, userId INT NOT NULL, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE, INDEX userId (userId) USING HASH, PRIMARY KEY (id));"

	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "CREATE TABLE OilGaugeWebService.deviceIpHistory (id INT NOT NULL AUTO_INCREMENT, deviceId INT NOT NULL, FOREIGN KEY (deviceId) REFERENCES devices(id) ON DELETE CASCADE, INDEX deviceId (deviceId) USING HASH, connectionTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP, ip varchar(25) NOT NULL, PRIMARY KEY (id));"

	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "CREATE TABLE OilGaugeWebService.userIpHistory (id INT NOT NULL AUTO_INCREMENT, userId INT NOT NULL, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE, INDEX userId (userId) USING HASH, connectionTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP, ip varchar(25) NOT NULL, PRIMARY KEY (id));"

	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "CREATE TABLE OilGaugeWebService.oilLevel (id INT NOT NULL AUTO_INCREMENT, userId INT NOT NULL, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE, INDEX userId (userId) USING HASH, deviceId INT NOT NULL, FOREIGN KEY (deviceId) REFERENCES devices(id) ON DELETE CASCADE, INDEX deviceId (deviceId) USING HASH, oilLevelReadingCentimeters DECIMAL(4,2) NOT NULL, PRIMARY KEY (id));"

	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "CREATE TABLE OilGaugeWebService.batteryLevel (id INT NOT NULL AUTO_INCREMENT, userId INT NOT NULL, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE, INDEX userId (userId) USING HASH, deviceId INT NOT NULL, FOREIGN KEY (deviceId) REFERENCES devices(id) ON DELETE CASCADE, INDEX deviceId (deviceId) USING HASH, batteryLevelReading INT NOT NULL, PRIMARY KEY (id));"

	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "CREATE TABLE OilGaugeWebService.oilPrices (id INT NOT NULL AUTO_INCREMENT, priceTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP, oilPrice DECIMAL(4,2) NOT NULL, PRIMARY KEY (id));"

	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "INSERT INTO roles (roleName) VALUES ('admin');"
	
	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "INSERT INTO roles (roleName) VALUES ('user');"
	
	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "INSERT INTO users (userName, userEmail, userSalt, userPass, userRole) VALUES ('administrator', 'admin@localhost', '\$2a\$10\$ycSCnV5iMNmFt3m/UhKH1e', '\$2a\$10\$ycSCnV5iMNmFt3m/UhKH1em0MWE0kYQdWayB3KDSqmpXFiJ0MxExO', 1);"
	
	mysql -uroot -p${mySqlPassword} -D OilGaugeWebService -e "CREATE VIEW usersWithRoles AS SELECT users.id, users.userName, users.userEmail, users.userSalt, users.userPass, users.userRole, roles.roleName FROM users INNER JOIN roles ON users.userRole=roles.id;"
	
	mysql -uroot -p${mySqlPassword} -e "CREATE USER 'OilGaugeWebService_User'@'localhost' IDENTIFIED BY '${databaseServicePassword}';"

	mysql -uroot -p${mySqlPassword} -e "GRANT ALL ON OilGaugeWebService.* TO 'OilGaugeWebService_User'@'localhost'"
}

generateSelfSignedCerts ()
{
	openssl req \
	-new \
	-newkey rsa:4096 \
	-days 1000 \
	-nodes \
	-x509 \
	-subj "/C=US/ST=MA/L=Boston/O=Nope/CN=OilGaugeWebService" \
	-keyout ./private/certificates/server.key \
	-out ./private/certificates/server.crt
}

createConfig ()
{
	echo "module.exports = {" > ./private/config.js
	echo "	\"dbAddress\": \"127.0.0.1\"," >> ./private/config.js
	echo "	\"dbPort\": 1433," >> ./private/config.js
	echo "	\"dbUser\": \"OilGaugeWebService_User\"," >> ./private/config.js
	echo "	\"dbPassword\": \"${databaseServicePassword}\"," >> ./private/config.js
	echo "	\"dbName\": \"OilGaugeWebService\"," >> ./private/config.js
	echo "	\"cookieSecret\": \"${cookieSecret}\"," >> ./private/config.js
	echo "	\"hashStrength\": 10" >> ./private/config.js
	echo "}" >> ./private/config.js
}

checkIfSudo
collectInformation
checkPrerequisites
createDatabase
generateSelfSignedCerts
createConfig
