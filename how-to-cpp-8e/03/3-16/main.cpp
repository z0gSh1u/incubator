#include <iostream>
#include <string>
#include <cstdlib>

using namespace std;

class HeartRates
{
private:
	string firstName, lastName;
	int birthMonth, birthDay, birthYear;
	int maxHeartRate, myAge;

public:
	void setBirthMonth(int mm)
	{
		birthMonth = mm;
	}

	void setBirthDay(int dd)
	{
		birthDay = dd;
	}

	void setBirthYear(int yy)
	{
		birthYear = yy;
	}

	int getBirthMonth()
	{
		return birthMonth;
	}

	int getBirthDay()
	{
		return birthDay;
	}

	int getBirthYear()
	{
		return birthYear;
	}

	HeartRates(int mm, int dd, int yy)
	{
		setBirthMonth(mm);
		setBirthDay(dd);
		setBirthYear(yy);
	}

	int getAge()
	{
		int cmm,cdd,cyy;
		cout << "Please enter the current date MM DD YYYY." << endl;
		cin >> cmm >> cdd >> cyy;

		if ((cmm>birthMonth) || ((cmm==birthMonth)&&(cdd>=birthDay)))
		{
			myAge = cyy-birthYear;
			return myAge;
		}
		else 
		{
			myAge = cyy-birthYear-1;
			return myAge;
		}
	}

	int getMaximumHeartRate()
	{
		maxHeartRate = 220-myAge;
		return maxHeartRate;
	}

	int getTargetHeartRateA()
	{
		return 0.5*maxHeartRate;
	}

	int getTargetHeartRateB()
	{
		return 0.85*maxHeartRate;
	}

	void getTargetHeartRate()
	{
		cout << "The target-heart-rate range is " << getTargetHeartRateA() << " to " << getTargetHeartRateB() << "." << endl;
	}
};


int main()
{
	int mm,dd,yy;

	cout << "Please enter your birth month, birth day and birth year MM DD YYYY." << endl;
	cin >> mm >> dd >> yy;

	HeartRates myHeartRates(mm,dd,yy);

	cout << "Your age is " << myHeartRates.getAge() << " years old." << endl;

	cout << "Your maximum heart rate is " << myHeartRates.getMaximumHeartRate() << "." << endl;

	myHeartRates.getTargetHeartRate();

	system("pause");

	return 0;
}