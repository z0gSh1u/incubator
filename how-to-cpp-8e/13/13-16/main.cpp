#include <vector>
#include <typeinfo>
#include "Account.h"
#include <cstdlib>

using namespace std;

int main()
{
	vector<Account*> accounts;
	Account* p1 = new SavingsAccount(1000, 0.5);
	Account* p2 = new CheckingAccount(1000, 20);
	accounts.push_back(p1);
	accounts.push_back(p2);

	for (auto i = accounts.begin(); i != accounts.end(); i++)
	{
		int toDraw;
		cout << "Please Input toWithDraw: ";
		cin >> toDraw;

		(*i)->debit(toDraw);

		double interest = (*i)->calculateInterest();
		if (interest != -1)
			(*i)->credit(interest);

		cout << "Current Balance: " << (*i)->getBalance() << endl;
	}

	system("pause");
	return 0;
}