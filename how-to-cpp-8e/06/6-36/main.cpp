#include <iostream>
#include <cstdlib>

using namespace std;

double power (double base, int exp)
{
	if (exp==1) return base; 
	else return base*power(base,exp-1);
}

int main()
{
	double a;
	int b;
	cin >> a >> b;
	cout << power(a,b);

	system("pause");
	return 0;
}