#include <iostream>
#include <cstdlib>

using namespace std;


bool isPerfect(int num)
{
	int sum=0;
	for (int i=1; i<=(num/2)+1; i++)
		if (num%i==0) sum+=i;
	return (num==sum);
}

int main()
{
	for (int i=1; i<=1000; i++)
		if (isPerfect(i)) cout << i << endl; // else cout << "!!" << i << endl;
	
	system("pause");
	return 0;
}