#include <iostream>
#include "Time.h"
#include <cstdlib>

using namespace std;

int main()
{
	Time a(11,22,33);
	a.printStandard();
	cout << endl;
	a.printUniversal();

	system("pause");
	return 0;
}