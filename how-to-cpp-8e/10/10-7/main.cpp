#include <iostream>
#include <cstdlib>

using namespace std;

class SavingsAccount
{
private:
	double savingsBalance;
	
	static double annualInterestRate;
public:


	SavingsAccount(double Balance)
	{
		savingsBalance = Balance;
	}

	double calculateMonthlyInterest()
	{
		double interest = savingsBalance*annualInterestRate/12;
		savingsBalance += interest;
		return interest;
	}

	static void modifyInterestRate(double Rate)
	{
		annualInterestRate = Rate;
	}
};

double SavingsAccount::annualInterestRate = 0;

int main()
{
	
	SavingsAccount saver1(2000), saver2(3000);
	SavingsAccount::modifyInterestRate(0.3);
	cout << "MONTH 1" << endl << "SAVER1: " << saver1.calculateMonthlyInterest() 
		 << "\nSAVER2: " << saver2.calculateMonthlyInterest() << endl;

	SavingsAccount::modifyInterestRate(0.4);
	cout << "MONTH 2" << endl << "SAVER1: " << saver1.calculateMonthlyInterest() 
		 << "\nSAVER2: " << saver2.calculateMonthlyInterest() << endl;

	system("pause");

	return 0;
}