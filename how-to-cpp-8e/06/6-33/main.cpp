#include <iostream>
#include <time.h>
#include <cstdlib>

using namespace std;

int flip()
{
	return rand()%2;
}

int main()
{
	srand(time(0));

	for (int i=1; i<=100; i++)
		if (flip()) cout << "Heads" << endl; else cout << "Tails" << endl;

	system("pause");
	return 0;
}