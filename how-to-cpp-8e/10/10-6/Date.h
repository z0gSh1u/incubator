#pragma once

#include <iostream>
#include <stdexcept>
#include <string>
#include <sstream>
#include <ctime>

using namespace std;

class Date
{
public:
	static const int monthsPerYear = 12;
	Date( int, int, int );
	void print() const;
	~Date();

	// added functions: 
	// a)
	void add_zero_print(int a)
	{
		if (a<10) cout << '0';
		cout << a;
	}
	void mul_print()
	{
		add_zero_print(month); cout << " "; add_zero_print(day); cout << " " << year << endl;
		add_zero_print(month); cout << '/'; add_zero_print(day); cout << '/' << year%100 << endl;
		switch(month)
		{
		case 1: cout << "January"; break;	case 2: cout << "February"; break;
		case 3: cout << "March"; break;		case 4: cout << "April";
		case 5: cout << "May"; break;		case 6: cout << "June"; break;
		case 7: cout << "July"; break;		case 8: cout << "August"; break;
		case 9: cout << "September"; break;	case 10: cout << "October"; break;
		case 11: cout << "November"; break;	case 12: cout << "December"; break;
		}
		cout << " ";
		add_zero_print(day);
		cout << ", " << year;
	}
	// end of a)
	// b)
	int string_to_int(string a)
	{
		int res = 0;
		for (int i = 0; i <= a.size() - 1; i++)
		{
			res *= 10;
			res += a[i] - '0';
		}
		return res;
	}
	Date(string date)
	{
		int mode; // 0: MM DD YYYY  1: MM/DD/YY  2: June 14, 1992
		if (date.find('/') != -1) mode = 1;
		else if (date.find(',') != -1) mode = 2;
		else mode = 0;
		
		switch(mode)
		{
		case 0:	   {
			string MM = date.substr(0,2);
			string DD = date.substr(3,2);
			string YYYY = date.substr(6,4);
			month = string_to_int(MM);
			day = string_to_int(DD);
			year = string_to_int(YYYY);
			break; }
		case 1:    {
			string MM = date.substr(0,2);
			string DD = date.substr(3,2);
			string YYYY = date.substr(6,2);
			month = string_to_int(MM);
			day = string_to_int(DD);
			year = string_to_int(YYYY);
			break; }
		case 2:    {
			stringstream ss;
			ss.str(date);
			string MM, DD, YYYY;
			ss >> MM >> DD >> YYYY;
			int MMint;
			if (MM == "January") MMint = 1;
			else if (MM == "February") MMint = 2; else if (MM == "March") MMint = 3;
			else if (MM == "April") MMint = 4; else if (MM == "May") MMint = 5;
			else if (MM == "June") MMint = 6; else if (MM == "July") MMint = 7;
			else if (MM == "August") MMint = 8; else if (MM == "September") MMint = 9;
			else if (MM == "October") MMint = 10; else if (MM == "November") MMint = 11;
			else if (MM == "December") MMint = 12;
			month = MMint;
			if (DD.size()==2) DD = DD.substr(0,1); else DD = DD.substr(0,2);
			day = string_to_int(DD);
			year = string_to_int(YYYY);
			break;  }
		}

	}
	// end of b)
	// c)
	Date()
	{
		time_t mills = time(0);
		struct tm *ptm = localtime(&mills);
		year = ptm->tm_year + 1900;
		month = ptm->tm_mon + 1;
		day = ptm->tm_mday;
	}
	// end of c)
	// end of added functions

private:
	int month;
	int day;
	int year;

	int checkDay( int ) const;
};