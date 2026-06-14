#include <iostream>
#include <iomanip>
#include <stdexcept>
#include "Time.h"

#include <windows.h>
#include <cstdlib>

using namespace std;

Time::Time(int hour, int minute, int second)
{
	setTime(hour,minute,second);
}

void Time::setTime(int h, int m, int s)
{
	setHour(h); setMinute(m); setSecond(s);
}

void Time::setHour(int h)
{
	if (h>=0 && h<24)
		hour = h;
	else 
		throw invalid_argument("hour must be 0-23");
}

void Time::setMinute(int m)
{
	if (m>=0 && m<60)
		minute = m;
	else 
		throw invalid_argument("minute must be 0-59");
}

void Time::setSecond(int s)
{
	if (s>=0 && s<60)
		second = s;
	else 
		throw invalid_argument("second must be 0-59");
}

int Time::getHour()
{
	return hour;
}

int Time::getMinute()
{
	return minute;
}

int Time::getSecond()
{
	return second;
}

void Time::printUniversal()
{
	cout << setfill('0') << setw(2) << getHour() << ":"
		<< setw(2) << getMinute() << ":" << setw(2) << getSecond();
}

void Time::printStandard()
{
	cout << ( (getHour()==0 || getHour()==12) ? 12 : getHour()%12 )
		<< ":" << setfill('0') << setw(2) << getMinute() 
		<< ":" << setw(2) << getSecond() << (hour<12 ? " AM" : " PM");
}

void Time::tick()
{
	Time t=*this;
	while (1)
	{
		t.second++;

		if (t.second==60) { t.second=0; t.minute++; }
		if (t.minute==60) { t.minute=0; t.hour++; }
		if (t.hour==24) { t.hour=0; t.minute=0; t.second=0; }

		system("cls");
		t.printUniversal();
		cout << endl;
		t.printStandard();

		Sleep(1000);
	}
}