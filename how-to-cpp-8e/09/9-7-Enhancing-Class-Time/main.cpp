#include <iostream>
#include "Time.h"

using namespace std;

int main()
{
	Time a;
	a.setTime(23,59,44);
	a.tick();
	return 0;
}