class bankAccountMultipleNameException extends Error {
    setAccountList(acctList) {
	this.resultList = [];
	for(let i=0;i<acctList.length;i++) {
	    this.resultList.push({'name':acctList[i].ownerName,'birthday':acctList[i].ownerBirthdate,'number':acctList[i].accountNumber});
	}
    }
};

class bankAccount {
    /*
     * ------------------------------------------------------------------------
     * INSTANCE METHODS
     * ------------------------------------------------------------------------
     */
    /*
     * @constructor
     * @returns {bankAccount}
     */
    constructor() {
	/** @type {Number} */
	this.balance = 0;
	this.ownerName = 'anonymous bank account';
	this.ownerCommonName = '';
	this.ownerBirthdate = '0000-00-00';
	this.ownerMMName = '';
	this.accountNumber = '20172019-00000000';
	this.history = [];
    }
    /**
     * 
     * @param {Number} amount = negative amount withdraws from, positive amount deposits on the balance
     * @param {String} otherParty the other party in this transaction
     * @param {String} transactionId a unique transaction ID
     * @param {String} remark
     * @returns {bankAccount}
     */
    changeBalance(amount,otherParty,transactionId,remark) {
	if (typeof remark==='undefined') {
	    remark = '';
	}
	this.balance += amount;
	let date = new Date();
	let historyEntry = {
	    "when":date.toISOString(),
	    "whenUTS":date.getTime(),
	    "amount":amount,
	    "balanceAfter":this.balance,
	    "transactionId":transactionId,
	    "otherParty":otherParty,
	    "remark":remark
	};
	this.history.push(historyEntry);
	return this;
    }
    /**
     * Transfer funds from this account to another.
     * @param {String|bankAccount} recipient either as a bankAccount object, or an account number
     * @param {Number} amount to transfer
     * @param {String} remark additional remark
     * @returns {String}
     */
    transferTo(recipient,amount,remark) {
	return bankAccount.transfer(this,recipient,amount,remark);
    }
    /*
     * ------------------------------------------------------------------------
     * STATIC METHODS
     * ------------------------------------------------------------------------
     */
    /**
     * Return a "common name" format for a name (lowers the case).
     * @param {String} nam
     * @returns {unresolved}
     */
    static commonName(nam) {
	return nam.toLocaleLowerCase();
    }
    /**
     * Create a new bank account and place it in the accounts directory.
     * @param {String} ownerName
     * @param {String} birthDate YYYY-MM-DD format
     * @param {String} mothersMaidenName
     * @returns {bankAccount}
     */
    static createAccount(ownerName,birthDate,mothersMaidenName) {
	if (typeof bankAccount.lastAccountNumber==='undefined') {
	    bankAccount.lastAccountNumber = 0;
	    bankAccount.accounts = {};
	}
	
	let myAcctNumber = ++bankAccount.lastAccountNumber;
	myAcctNumber = myAcctNumber.toString();
	while (myAcctNumber.length<8) {
	    myAcctNumber = '0'+myAcctNumber;
	}
	myAcctNumber = '20172019-'+myAcctNumber;
	let newAcct = new bankAccount();
	newAcct.ownerName = ownerName;
	newAcct.ownerCommonName = bankAccount.commonName(ownerName);
	newAcct.ownerBirthdate = birthDate;
	newAcct.ownerMMName = mothersMaidenName;
	newAcct.accountNumber = myAcctNumber;
	bankAccount.accounts[myAcctNumber] = newAcct;
	if (typeof bankAccount.accounts[newAcct.ownerCommonName]==='undefined') {
	    bankAccount.accounts[newAcct.ownerCommonName] = [];
	}
	bankAccount.accounts[newAcct.ownerCommonName].push(newAcct);
	return newAcct;
    }
    
    static getAccountByName(searchName) {
	searchName = searchName.toLocaleLowerCase();
	if (typeof bankAccount.accounts[searchName]!=='undefined') {
	    return bankAccount.accounts[searchName].slice();
	}
	let result = [];
	let names = Object.keys(bankAccount.accounts);
	names = names.filter(function(nam) {
	    return nam.substr(0,8)!=='20172019';
	});
	for(let i=0;i<names.length;i++) {
	    if (names[i].indexOf(searchName)>-1) {
		result = result.concat(bankAccount.accounts[names[i]]);
	    }
	}
	return result;
    }
    /**
     * Return a bankAccount by its account number.
     * @param {String} searchNum
     * @returns {bankAccount|null}
     */
    static getAccountByNumber(searchNum) {
	if (typeof bankAccount.accounts[searchNum]!=='undefined') {
	    return bankAccount.accounts[searchNum];
	}
	else if (typeof bankAccount.accounts['20172019-'+searchNum]!=='undefined') {
	    return bankAccount.accounts['20172019-'+searchNum];
	}
	else {
	    return null;
	}
    }
    /**
     * Remove an account from the accounts directory.
     * @param {String} nameOrAcctNo
     * @returns {bankAccount} the removed account
     */
    static removeAccount(nameOrAcctNo) {
	/** @type {bankAccount} */
	let thisAcct = null;
	if (nameOrAcctNo.substr(0,8)==='20172019') {
	    thisAcct = bankAccount.getAccountByNumber(nameOrAcctNo);
	}
	else {
	    let results = bankAccount.getAccountByName(nameOrAcctNo);
	    if (results.length>1) {
		let err = new bankAccountMultipleNameException("multiple names, choose");
		err.setAccountList(results);
		throw err;
	    } 
	    else if (results.length===1) {
		thisAcct = results[0];
	    }
	}
	if (thisAcct===null) {
	    throw new Error('account not found');
	}
	delete bankAccount.accounts[thisAcct.accountNumber];
	bankAccount.accounts[thisAcct.ownerCommonName] = bankAccount.accounts[thisAcct.ownerCommonName].filter(function(item) {
	    return item!==thisAcct;
	});
	if (bankAccount.accounts[thisAcct.ownerCommonName].length===0) {
	    delete bankAccount.accounts[thisAcct.ownerCommonName];
	}
	return thisAcct;
    }
    /**
     * Return a unique transaction ID, automatically generated.
     * @returns {String}
     */
    static createTransactionId() {
	let nt = new Date().getTime();
	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) + '-' + nt.toString();
    }
    /**
     * Transfer funds between accounts.
     * @param {String|bankAccount} sender either as a bankAccount object, or an account number
     * @param {String|bankAccount} recipient either as a bankAccount object, or an account number
     * @param {Number} amount to transfer
     * @param {String} remark additional remark
     * @returns {String}
     */
    static transfer(sender,recipient,amount,remark) {
	if (typeof sender!=='object') {
	    sender = bankAccount.getAccountByNumber(sender);
	}
	if (typeof recipient!=='object') {
	    recipient = bankAccount.getAccountByNumber(recipient);
	}
	if (sender===null || recipient===null || typeof sender['ownerName']==='undefined' || typeof recipient['ownerName']==='undefined') {
	    throw new Error('sender or recipient not found');
	}
	if (sender.balance-amount < 0) {
	    throw new Error('sender does not have enough funds');
	}
	let trid = bankAccount.createTransactionId();
	sender.changeBalance(-1*amount,recipient.ownerName+'@'+recipient.accountNumber,trid,remark);
	recipient.changeBalance(amount,sender.ownerName+'@'+sender.accountNumber,trid,remark);
	return trid;
    }
    /**
     * Psst.
     * @returns {bankAccount[]}
     */
    static getAccountsAsArray() {
	let names = Object.keys(bankAccount.accounts);
	names = names.filter(function(nam) {
	    return nam.substr(0,8)==='20172019';
	});
	let result = [];
	for(let i=0;i<names.length;i++) {
	    result.push(bankAccount.accounts[names[i]]);
	}
	return result;
    }
    /**
     * Return the total capital of the bank at the current moment.
     * 
     * The total capital is counted by adding up the balances of individual accounts.
     * 
     * TODO
     * 
     * @returns {Number}
     */
    static totalCapital() {
	let countedCapital = 0;
        var accArray = bankAccount.getAccountsAsArray();
	for (let i=0; i<accArray.length; ++i) {
            countedCapital = accArray.balance[i];
        }
	return countedCapital;
    }
    /**
     * Return an array containing all accounts showing their number, their owner's name and the current balance.
     * 
     * console.log should show:
     * [
     *  { accountNumber: '<ACCOUNT NUMBER>',
     *    owner: '<ACCOUNT OWNER>',
     *    balance: <CURRENT_BALANCE> },
     *  { accountNumber: ...etc } ]
     * 
     * TODO
     * 
     * @returns {Array}
     */
 static currentLedger() {
	let results = [];
        var accountArray = bankAccount.getAccountsAsArray();
        for (let i=0; i<accountArray.length; i++){
            results[i] = {accountNumber:accountArray[i].accountNumber, owner:accountArray[i].ownerName,balance:accountArray[i].balance};   
        }  
        
	return results;
}
}


let centralAcct = bankAccount.createAccount("CENTRAL BANK ACCOUNT","2018-02-16","-").changeBalance(10000000,"Mafia Plc",bankAccount.createTransactionId(),"initial funds");
let BandisAccount = bankAccount.createAccount("KEMÉNY ANDRÁS ISTVÁN","1975-02-15","psst secret").changeBalance(50000,"ATM03223",bankAccount.createTransactionId(),"cash deposit");
centralAcct.transferTo(BandisAccount,150000,"money laundering, psst, dont tell the fbi or the irs");
bankAccount.transfer(centralAcct,BandisAccount,150000,"some more money laundering");

bankAccount.
//console.log(BandisAccount.history);
//console.log(centralAcct.history);

/*
 * These are your homework tasks' outputs.
 */
console.log(bankAccount.totalCapital());
console.log(bankAccount.currentLedger());


