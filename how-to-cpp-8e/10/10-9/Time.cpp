#include <iostream>
#include <iomanip>
#include "Time.h"

using namespace std;

Time::Time( int hr, int min, int sec)
{
	setTime(hr, min, sec);
}

Time& Time::setTime(int h, int m, int s)
{
	passSecond = h*3600 + m*60 + s;
	return *this;
}

Time& Time::setHour(int h)
{
	if ( h>=0 && h<24 )
	{
		int bak = passSecond;
		bak /= 3600; // total hours
		bak %= 24; // cur hours
		passSecond -= bak*3600;
		passSecond += h*3600;
	}
	else
		throw invalid_argument("hour must be 0-23");
	return *this;
}

Time& Time::setMinute(int m)
{
	if ( m>=0 && m<60 )
	{
		int bak = passSecond;
		bak /= 60; // total mins
		bak %= 60; // cur mins
		passSecond -= bak*60;
		passSecond += m*60;
	}
	else
		throw invalid_argument("minute must be 0-59");
	return *this;
}

Time& Time::setSecond(int s)
{
	if ( s>=0 && s<60 )
	{
		int bak = passSecond;
		bak %= 60;
		passSecond -= bak;
		passSecond += s;
	}
	else
		throw invalid_argument("second must be 0-59");
	return *this;
}

int Time::getHour() const
{
	return passSecond/3600%24;
}

int Time::getMinute() const
{
	return passSecond/60%60;
}

int Time::getSecond() const
{
	return passSecond%60;
}

void Time::printUniversal() const
{
	cout << setfill('0') << setw(2) << getHour() << ":"
		<< setw(2) << getMinute() << ":" << setw(2) << getSecond();
}

void Time::printStandard() const
{
	cout << ( ( getHour() == 0 || getHour() == 12 ) ? 12 : getHour() % 12 )
		<< ":" << setfill('0') << setw(2) << getMinute()
		<< ":" << setw(2) << getSecond() << ( getHour() < 12 ? " AM" : " PM");
}