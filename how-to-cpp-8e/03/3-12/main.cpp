#include <iostream>
#include <cstdlib>

using namespace std;

class Account
{
private:
	int balance;

public:
	Account (int init)
	{
		if (init >= 0)
			balance = init;
		else cout << "Error: Balance input invalid!" << endl;
	}
	
	void credit(int a)
	{
		balance += a;
	}

	void debit(int a)
	{
		if (a<=balance) 
			balance -= a;
		else cout << "Debit amount exceeded account balance." << endl;
	}

	int getBalance()
	{
		return balance;
	}

};

int main()
{
	Account user1(100);
	Account user2(200);
	user1.credit(10000);
	user2.debit(50);
	cout << "User1 balance: " << user1.getBalance() << ". User2 balance: " << user2.getBalance() << endl;

	system("pause");
	return 0;
}