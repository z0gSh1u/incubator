#include <iostream>
#include <cstdlib>

using namespace std;

void encrypt1(int &a)
{
	a = (a+7) % 10;
}

void swap(int &a, int &b)
{
	int tmp;
	tmp = a;
	a = b;
	b = tmp;
}

int main()
{
	int a,b,c,d,input;
	cout << "Please input a four-digit number." << endl;
	cin >> input;

	//                         ____
	// The number is stored as abcd
	
	d = input%10;
	input /= 10;
	c = input%10;
	input /= 10;
	b = input%10;
	input /= 10;
	a = input;

	// Encrypt 1
	encrypt1(a);
	encrypt1(b);
	encrypt1(c);
	encrypt1(d);

	// Encrypt 2
	swap(a,c);
	swap(b,d);

	// Output
	cout << "The encrypted number is " << a << b << c << d << "." << endl;

	system("pause");
	return 0;
}