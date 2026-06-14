#include <iostream>
#include <cstdlib>

using namespace std;

int main()
{
	int account;
	float beginBalance, charges, credits, limit, newBalance;

	cout << "Enter account number (or -1 to quit): ";
	cin >> account;

	while (account != -1)
	{
		cout << "Enter beginning balance: ";
		cin >> beginBalance;
		cout << "Enter total charges: ";
		cin >> charges;
		cout << "Enter total credits: ";
		cin >> credits;
		cout << "Enter credit limit: ";
		cin >> limit;

		newBalance = beginBalance + charges - credits;

		cout << "New balance is " << newBalance << endl;
		cout << "Account:\t" << account << endl;
		cout << "Credit limit:\t" << limit << endl;
		cout << "Balance:\t" << newBalance << endl;


		if (newBalance <= limit)
			cout << endl;
		if (newBalance > limit)
			cout << "Credit Limit Exceeded.\n" << endl;

		cout << "Enter account number (or -1 to quit): ";
		cin >> account;
	}

	system("pause");

	return 0;
}
