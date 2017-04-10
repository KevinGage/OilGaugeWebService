//Import modules
var db = require('../private/db.js');

//Setup a counter to keep track of callbacks
var counter = 0;

function doneYet() {
	//!!!!!!!!!!!!!!!!!!!!! CHANGE THIS COUNTER TO INCLUDE OIL AND BATTERY DATA CALLBACKS WHEN THEY ARE ADDED!
	if (counter > 40) {
                db.dbConnection.disconnect(function(err) {
        		console.log(err);
			process.exit();
		});
	}

}

//Create 10 user accounts
var users = [{username:"user1", password:"password", role:2, email:"blah1@localhost"}, {username:"user2", password:"password", role:2, email:"blah2@localhost"}, {username:"user3", password:"password", role:2, email:"blah3@localhost"},{username:"user4", password:"password", role:2, email:"blah4@localhost"},{username:"user5", password:"password", role:2, email:"blah5@localhost"},{username:"user6", password:"password", role:2, email:"blah6@localhost"},{username:"user7", password:"password", role:2, email:"blah7@localhost"},{username:"user8", password:"password", role:2, email:"blah8@localhost"},{username:"user9", password:"password", role:2, email:"blah9@localhost"},{username:"user10", password:"password", role:2, email:"blah10@localhost"}];

users.forEach(function(user){
	db.users.insertNew(user.username, user.password, user.role, user.email, function(err) {
		counter ++;
		doneYet();
		console.log(err);
	});
});

//Create a device for all but 1 user
for (var i=1; i < 11; i ++) {
	db.devices.insertNew(i.toString(), i, function(err) {
		counter++;
		doneYet();
		console.log(err);
	});
}

//Create some more devices so one user has 2 devices and another has lots
db.devices.insertNew("20", 2, function(err) {
	counter++;
	doneYet();
        console.log(err);
});

for (var i=50; i < 70; i ++) {
        db.devices.insertNew(i.toString(), 3, function(err) {
                counter++;
		doneYet();
                console.log(err);
        });
}

//Create oil data for devices
/*
Data should start on current date, then sub -1 hour for each additional

1 device no data

1 device 1 data

1 device 5 data

Other devices 750 data

*/

//Create battery data for devices
/*
Data should start on current date, then sub -1 hour for each additional

1 device no data

1 device 1 data

1 device 5 data

Other devices get 750 data

*/
