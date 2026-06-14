#include <iostream>
#include <cstdlib>

using namespace std;

bool book[1000];

void init()
{
	for (int i=0; i<=999; i++)
		book[i]=true;
}

void doit()
{
	for (int i=2; i<=500; i++)
		for (int j=2; j*i<=999; j++)
			book[j*i]=false;
}

void printit()
{
	for (int i=2; i<=999; i++)
		if (book[i]) cout << i << ' ';
}

int main()
{
	init();	
	doit();
	printit();
	system("pause");
	return 0;
}