//     ____           __          __
//    /  _/___  _____/ /_  ______/ /__  _____
//    / // __ \/ ___/ / / / / __  / _ \/ ___/
//  _/ // / / / /__/ / /_/ / /_/ /  __(__  )
// /___/_/ /_/\___/_/\__,_/\__,_/\___/____/

var express = require('express');

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(':memory:');

var StellarSdk = require('stellar-sdk');
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const fetch = require('node-fetch');

 const crypto = require('crypto');

//    _____
//   / ___/___  ______   _____  _____
//   \__ \/ _ \/ ___/ | / / _ \/ ___/
//  ___/ /  __/ /   | |/ /  __/ /
// /____/\___/_/    |___/\___/_/

var app = express();
var serv = require('http').Server(app);
var server_port = 2000;

app.use(express.static(__dirname+ '/web'));
app.get('/', function(req,res){
	res.sendFile(__dirname+ '/web/index.html');
});

app.get('/tokens', function(req,res){
	console.log("Issuing assets");
	sendTokens();
	res.sendStatus(200);
});

// app.get('/balances/:publicKey', function(req,res){
// 	console.log("Show balances");
// 	//showBalances();
	 // try {
	 //    var ret = await verifyBalance(req.params.publicKey);
	 //    res.json(ret);
	 //  } catch (error) {
	 //    console.log(error);
	 //  }
// 	//res.sendStatus(200);
// });

app.get('/balances/:publicKey', async(req, res, next) => {
	 try {
	    var ret = await verifyBalance(req.params.publicKey);
	    res.json(ret);
	  } catch (error) {
	    console.log(error);
	  }
});

app.get('/configure-receiver', function(req,res){
	console.log("Configuring receiver");
	configureReceiver();
	res.sendStatus(200);
});

app.get('/vote/:index/:option', function(req, res) {
	var index = req.params.index;
	var option  = req.params.option;
	console.log("Receiving vote["+index+"]="+option);
	vote(index,option);
  	res.send(200);
});

app.get('/get-all-accounts', function(req,res){
	console.log("Getting all accounts");
	var arr_obj_result = [];
    arr_accounts.forEach(function(element){
		arr_obj_result.push( {public: element.publicKey() , private : element.secret()} );
	});
	var obj_result = {
		issuer : {public: issuer_account.publicKey() , private : issuer_account.secret() },
		receiver : {public: receiver_account.publicKey() , private : receiver_account.secret() },
		accounts : arr_obj_result
	};
	res.json(obj_result);
});

serv.listen(server_port);
console.log("Server started in port: "+server_port);

//    ________      __          __                    _       __    __
//   / ____/ /___  / /_  ____ _/ /  _   ______ ______(_)___ _/ /_  / /__  _____
//  / / __/ / __ \/ __ \/ __ `/ /  | | / / __ `/ ___/ / __ `/ __ \/ / _ \/ ___/
// / /_/ / / /_/ / /_/ / /_/ / /   | |/ / /_/ / /  / / /_/ / /_/ / /  __(__  )
// \____/_/\____/_.___/\__,_/_/    |___/\__,_/_/  /_/\__,_/_.___/_/\___/____/

var issuer_account;
var receiver_account;
var arr_accounts = [];
var NUMBER_OF_ACCOUNTS = 3;
var TOKEN_MXNA;
var TOKEN_MXNB;

const TOKEN_A = "MXNA";
const TOKEN_B = "MXNB";

//     ______                 __  _
//    / ____/_  ______  _____/ /_(_)___  ____  _____
//   / /_  / / / / __ \/ ___/ __/ / __ \/ __ \/ ___/
//  / __/ / /_/ / / / / /__/ /_/ / /_/ / / / (__  )
// /_/    \__,_/_/ /_/\___/\__/_/\____/_/ /_/____/

function createPairIssuerAccount(){
	issuer_account = StellarSdk.Keypair.random();
}

function createPairReseiverAccount(){
	receiver_account = StellarSdk.Keypair.random();
}

function createPairKeys(numberOfAccounts){
	for(var i=0;i<numberOfAccounts;i++){
		arr_accounts.push(StellarSdk.Keypair.random());
		arr_accounts[i].alias = crypto.createHash('sha256').update(Date.now()+arr_accounts[i].publicKey()).digest('base64');
		 console.log( crypto.createHash('sha256').update(Date.now()+arr_accounts[i].publicKey()).digest('base64') );
	}
}

const createAccount = async function(publicKey){
	try {
	  const response = await fetch(
	    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
	  );
	  const responseJSON = await response.json();
	  console.log("SUCCESS! You have a new account :)\n", responseJSON);
	  verifyBalance(publicKey);
	} catch (e) {
	  console.error("ERROR!", e);
	}
}

const verifyBalance  = async function(publicKey){
	var json_result = [];
	const account = await server.loadAccount(publicKey);
	console.log("Balances for account: " + publicKey );

	account.balances.forEach(function(balance) {
	  console.log("Type:", balance.asset_type, ",Code:", balance.asset_code , ", Balance:", balance.balance);
	  json_result.push( { type: balance.asset_type , asset_code : balance.asset_code , balance: balance.balance } );
	});

	return json_result;
}

function showBalances(){
	console.log("#Show balances#");
	console.log("Issuer Account");
	verifyBalance( issuer_account.publicKey() );
	console.log(issuer_account.secret());
	console.log(issuer_account.publicKey());
	console.log("Other Accounts");
	arr_accounts.forEach(function(element){
		console.log(element.secret());
		console.log(element.publicKey());
		verifyBalance( element.publicKey() );
	});
}

function printPairOfKeys(name,pair){
	console.log("Pair key of:"+name);
	console.log("Secret:" + pair.secret());
	console.log("Public:" + pair.publicKey());
}

function configureReceiver(){
	var receivingKeys = receiver_account;
	var issuingKeys = issuer_account;

	TOKEN_MXNA = new StellarSdk.Asset(TOKEN_A, issuingKeys.publicKey());
    TOKEN_MXNB = new StellarSdk.Asset(TOKEN_B, issuingKeys.publicKey());

	server.loadAccount(receivingKeys.publicKey())
	  .then(function(receiver) {
	    var transaction = new StellarSdk.TransactionBuilder(receiver, {
	      fee: StellarSdk.BASE_FEE,
	      networkPassphrase: StellarSdk.Networks.TESTNET
	    })
	      // The `changeTrust` operation creates (or alters) a trustline
	      // The `limit` parameter below is optional
	      .addOperation(StellarSdk.Operation.changeTrust({
	        asset: TOKEN_MXNA,
	        limit: '1000'
	      }))
	      .addOperation(StellarSdk.Operation.changeTrust({
	        asset: TOKEN_MXNB,
	        limit: '1000'
	      }))
	      // setTimeout is required for a transaction
	      .setTimeout(100)
	      .build();
	    transaction.sign(receivingKeys);
	    return server.submitTransaction(transaction);
	  })
	  .then(console.log)
	  // Second, the issuing account actually sends a payment using the asset
	  .then(function() {
	    return server.loadAccount(issuingKeys.publicKey())
	  })
	  .then(function(issuer) {
	    var transaction = new StellarSdk.TransactionBuilder(issuer, {
	      fee: StellarSdk.BASE_FEE,
	      networkPassphrase: StellarSdk.Networks.TESTNET
	    })
	      .addOperation(StellarSdk.Operation.payment({
	        destination: receivingKeys.publicKey(),
	        asset: TOKEN_MXNA,
	        amount: NUMBER_OF_ACCOUNTS+''
	      }))
	      .addOperation(StellarSdk.Operation.payment({
	        destination: receivingKeys.publicKey(),
	        asset: TOKEN_MXNB,
	        amount: NUMBER_OF_ACCOUNTS+''
	      }))
	      // .addOperation(StellarSdk.Operation.manageData({
	      //   name: "Irving",
	      //   value:  "Irving"
	      // }))
	      // setTimeout is required for a transaction
	      .setTimeout(100)
	      .build();
	    transaction.sign(issuingKeys);
	    return server.submitTransaction(transaction);
	  })
	  .then(console.log)
	  .catch(function(error) {
	    console.error('Error!', error);
	  });
}

function issuingAssets(receivingKeys){
	console.log("#Creating tokens#");
	// Keys for accounts to issue and receive the new asset
	// var issuingKeys = StellarSdk.Keypair
	//   .fromSecret('SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4');
	// var receivingKeys = StellarSdk.Keypair
	//   .fromSecret('SDSAVCRE5JRAI7UFAVLE5IMIZRD6N6WOJUWKY4GFN34LOBEEUS4W2T2D');

	var issuingKeys = receiver_account;

	// Create an object to represent the new asset
	// var astroDollar = new StellarSdk.Asset('AstroDollar', issuingKeys.publicKey());
	// First, the receiving account must trust the asset

	console.log("Creating trust between accounts:");
	printPairOfKeys("issuer",issuingKeys);
	console.log("Account:");
	printPairOfKeys("normalAccount",receivingKeys);

   server.loadAccount(receivingKeys.publicKey())
  .then(function(receiver) {
    var transaction = new StellarSdk.TransactionBuilder(receiver, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      // The `changeTrust` operation creates (or alters) a trustline
      // The `limit` parameter below is optional
      .addOperation(StellarSdk.Operation.changeTrust({
        asset: TOKEN_MXNA,
        limit: '1000'
      }))
      .addOperation(StellarSdk.Operation.changeTrust({
        asset: TOKEN_MXNB,
        limit: '1000'
      }))
      .addOperation(StellarSdk.Operation.manageData({
        name: receivingKeys.alias,
        value: ""
      }))
      // setTimeout is required for a transaction
      .setTimeout(100)
      .build();
    transaction.sign(receivingKeys);
    return server.submitTransaction(transaction);
  })
  .then(console.log)

  // Second, the issuing account actually sends a payment using the asset
  .then(function() {
    return server.loadAccount(issuingKeys.publicKey())
  })
  .then(function(issuer) {
    var transaction = new StellarSdk.TransactionBuilder(issuer, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: receivingKeys.publicKey(),
        asset: TOKEN_MXNA,
        amount: '1'
      }))
      .addOperation(StellarSdk.Operation.payment({
        destination: receivingKeys.publicKey(),
        asset: TOKEN_MXNB,
        amount: '1'
      }))
      // .addOperation(StellarSdk.Operation.manageData({
      //   name: "Irving",
      //   value:  "Irving"
      // }))
      // setTimeout is required for a transaction
      .setTimeout(100)
      .build();
    transaction.sign(issuingKeys);
    return server.submitTransaction(transaction);
  })
  .then(console.log)
  .catch(function(error) {
    console.error('Error!', error);
  });
}

function sendTokens(){
	var i = 1;
	arr_accounts.forEach(function(element){
		setTimeout(issuingAssets, i*6000, element);
		i++;
	});//Finish for each 
}

function vote(index,option){
	var voting_account = arr_accounts[index];
	var chosen_option = ( option == TOKEN_A )?TOKEN_MXNA:TOKEN_MXNB;
	
	var receivingKeys = receiver_account;

	server.loadAccount(voting_account.publicKey())
	.then(function(issuer) {
	    var transaction = new StellarSdk.TransactionBuilder(issuer, {
	      fee: StellarSdk.BASE_FEE,
	      networkPassphrase: StellarSdk.Networks.TESTNET
	    })
	      .addOperation(StellarSdk.Operation.payment({
	        destination: receivingKeys.publicKey(),
	        asset: chosen_option,
	        amount: '1'
	      }))
	      .addOperation(StellarSdk.Operation.manageData({
	        name: voting_account.alias,
	        value:  ""
	      }))
	      // setTimeout is required for a transaction
	      .setTimeout(100)
	      .build();
	    transaction.sign(voting_account);
	    return server.submitTransaction(transaction);
	  })
	  .then(console.log)

	  // Second, the issuing account actually sends a payment using the asset
	  .then(function() {
	    return server.loadAccount(receivingKeys.publicKey())
	  })
	  .then(function(receiver) {
	    var transaction = new StellarSdk.TransactionBuilder(receiver, {
	      fee: StellarSdk.BASE_FEE,
	      networkPassphrase: StellarSdk.Networks.TESTNET
	    })
	      .addOperation(StellarSdk.Operation.manageData({
	        name: voting_account.alias,
	        value:  ""
	      }))
	      .setTimeout(100)
	      .build();
	    transaction.sign(receivingKeys);
	    return server.submitTransaction(transaction);
	  })
	  .then(console.log)
	  .catch(function(error) {
	    console.error('Error!', error);
	  });
}

//     ____      _ __  _       __             __
//    /  _/___  (_) /_(_)___ _/ /  ________  / /___  ______
//    / // __ \/ / __/ / __ `/ /  / ___/ _ \/ __/ / / / __ \
//  _/ // / / / / /_/ / /_/ / /  (__  )  __/ /_/ /_/ / /_/ /
// /___/_/ /_/_/\__/_/\__,_/_/  /____/\___/\__/\__,_/ .___/
//                                                 /_/

console.log("#Creating issuerAccount#");
createPairIssuerAccount();
console.log("#Creating issuer account (Adding funds with Stellar Bot)#");
console.log(issuer_account.secret());
console.log(issuer_account.publicKey());
createAccount( issuer_account.publicKey() );
console.log("#Creating receiverAccount#");
createPairReseiverAccount();
console.log("#Creating receiver account (Adding funds with Stellar Bot)#");
console.log(receiver_account.secret());
console.log(receiver_account.publicKey());
createAccount( receiver_account.publicKey() );

console.log("============================================================");

console.log("#Creating pairs of keys#");
createPairKeys( NUMBER_OF_ACCOUNTS );
console.log("#Creating accounts (Adding funds with Stellar Bot)#");
arr_accounts.forEach(function(element){
	console.log("Account:");
	console.log(element.secret());
	console.log(element.publicKey());
	createAccount( element.publicKey() );
});


// http://localhost:2000/configure-receiver

// http://localhost:2000/tokens

// http://localhost:2000/balances

// http://localhost:2000/vote/0/MXNA
// http://localhost:2000/vote/1/MXNA

// Create Smart Contract
// Simulate poll



// Annotations
// https://www.stellar.org/developers/guides/issuing-assets.html
// https://www.sqlitetutorial.net/sqlite-nodejs/
