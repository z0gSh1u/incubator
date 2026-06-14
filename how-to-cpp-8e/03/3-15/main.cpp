#include <iostream>
#include <cstdlib>

using namespace std;

class Date
{
private:
	int day,month,year;

public:
	Date(int mm, int dd, int yy)
	{
		day = dd;
		year = yy;
		if ((mm>=1) && (mm<=12))
			month = mm;
		else
			month = 1;
	}

	void setDay(int dd)
	{
		day = dd;
	}

	void setMonth(int mm)
	{
		if ((mm>=1) && (mm<=12))
			month = mm;
		else
			month = 1;
	}

	void setYear(int yy)
	{
		year = yy;
	}

	int getDay()
	{
		return day;
	}

	int getMonth()
	{
		return month;
	}

	int getYear()
	{
		return year;
	}

	void displayDate()
	{
		cout << getMonth() << '/' << getDay() << '/' << getYear() << endl;
	}
};


int main()
{
	cout << "Please input the date MM DD YYYY." << endl;
	int mm,dd,yy;
	cin >> mm >> dd >> yy;
	Date myDate(mm,dd,yy);
	cout << "The date you input is: ";
	myDate.displayDate();
	system("pause");
	return 0;
}