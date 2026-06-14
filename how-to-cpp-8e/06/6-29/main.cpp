#include <iostream>
#include <cmath>
#include <cstdlib>

using namespace std;

bool isPrime(int num)
{
	for (int i=2; i<=(int)sqrt((double)num+1)+1; i++)
		if (num%i==0) return false;
	return true;
}

int main()
{
	for (int i=2; i<=10000; i++)
		if (isPrime(i)) cout << i << endl;

	system("pause");

	return 0;
}