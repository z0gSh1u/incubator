#pragma once

#include <iostream>

using namespace std;

class Account
{
protected:
	double balance;
	
public:
	Account(double initBalance)
	{
		if (initBalance >= 0.0)
			balance = initBalance;
		else
		{
			balance = 0.0;
			cout << "The initial balance is invalid" << endl;
		}
	}

	virtual void credit(double toAdd)
	{
		balance += toAdd;
	}

	virtual bool debit(double toTake)
	{
		if (balance - toTake < 0)
		{
			cout << "Debit amount exceeded account balance" << endl;
			return false;
		}
		else
		{
			balance -= toTake;
			return true;
		}
	}

	double getBalance()
	{
		return balance;
	}

	virtual double calculateInterest()
	{ return -1; };

};

class SavingsAccount : public Account
{
private:
	double rate;

public:
	SavingsAccount(double initBalance, double interestRate)
		: Account(initBalance)
	{
		rate = interestRate;
	}

	double calculateInterest()
	{
		return balance * rate;
	}

};

class CheckingAccount : public Account
{
private:
	double fee;

public:
	CheckingAccount(double initBalance, double fee)
		: Account(initBalance)
	{
		this->fee = fee;
	}

	void credit(double toAdd)
	{
		Account::credit(toAdd);
		balance -= fee;
	}

	bool debit(double toTake)
	{
		if (Account::debit(toTake))
		{
			balance -= fee;
			return true;
		}
		else return false;
	}

};