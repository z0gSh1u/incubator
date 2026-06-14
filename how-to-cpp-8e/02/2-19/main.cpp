#include <iostream>
#include <cstdlib>

using namespace std;

int main()
{
	cout << "Input three different integers: ";
	int a,b,c,sum,ave,prod,min,max;
	cin >> a >> b >> c;

	sum = a+b+c;
	ave = sum/3;
	prod = a*b*c;
	
	// min
	min = a;
	if (b<min) min=b;
	if (c<min) min=c;

	// max
	max = a;
	if (b>max) max=b;
	if (c>max) max=c;

	cout << "Sum is " << sum << endl;
	cout << "Average is " << ave << endl;
	cout << "Product is " << prod << endl;
	cout << "Smallest is " << min << endl;
	cout << "Largest is " << max << endl;

	system("pause");

	return 0;
}