var nodemailer = require('nodemailer');
var service = {};

service.sendForgotPasswordEmail = sendForgotPasswordEmail;
service.sendNewAccountEmail = sendNewAccountEmail;

function sendForgotPasswordEmail(tempUser){
    var isSent = true;
    const output = `
                <p>This mail contains your account's new password</p>
                <h3> Account Details</h3>
                <ul>
                    <li>Username: ${tempUser.username}</li>
                    <li>Password: ${tempUser.password}</li>
                </ul>
                <h3>IMPORTANT!</h3>
                <p>Please change your password as soon as possible.</p>`;
    
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'jeremybreccion@gmail.com', 
            pass: 'changetheworld'  
        }
    });

    let mailOptions = {
        from: '"Users Application" <jeremybreccion@gmail.com>',
        to: tempUser.email,
        subject: 'Account Password changed ✔',
        text: 'Welcome to Users Application',
        html: output
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(err, info) {
        if (err) {
            console.log(err);
            //cannot assign isSent here :(
            //example. if email password is incorrect, err will log but iSsent != false
            //isSent = false;
            //console.log('isSent inside sendMail()',isSent);
        }
    });

    //console.log('isSent outside sendMail()', isSent);

    return isSent;
}

function sendNewAccountEmail(tempUser, tempPass){
    var isSent = true;
    const output = `
                <p>You have been added as a user for the Enrollment Application</p>
                <h3> Account Details</h3>
                <ul>
                    <li>Username: ${tempUser.username}</li>
                    <li>Password: ${tempPass}</li>
                </ul>
                <h3>IMPORTANT!</h3>
                <p>Please change your password as soon as possible.</p>`;
    
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'jeremybreccion@gmail.com', 
            pass: 'changetheworld'  
        }
    });

    let mailOptions = {
        from: '"Users Application" <jeremybreccion@gmail.com>',
        to: tempUser.email,
        subject: 'Account Registered ✔',
        text: 'Welcome to Enrollment Application',
        html: output
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(err, info) {
        if (err) {
            console.log(err);
            //cannot assign isSent here :(
            //example. if email password is incorrect, err will log but iSsent != false
            //isSent = false;
            //console.log('isSent inside sendMail()',isSent);
        }
    });

    //console.log('isSent outside sendMail()', isSent);

    return isSent;
}

module.exports = service;