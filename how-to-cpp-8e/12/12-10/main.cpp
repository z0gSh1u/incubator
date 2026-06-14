#include <iostream>
#include <cstdlib>

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

	void credit(double toAdd)
	{
		balance += toAdd;
	}

	bool debit(double toTake)
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

	void debit(double toTake)
	{
		if (Account::debit(toTake))
			balance -= fee;
	}

};


int main()
{
	Account a(1000);
	SavingsAccount b(1200, 0.5);
	CheckingAccount c(1500, 20);

	b.credit(b.calculateInterest());
	c.debit(100);

	cout << a.getBalance() << endl;
	cout << b.getBalance() << endl;
	cout << c.getBalance() << endl;

	system("pause");
	return 0;
}