#include <iostream>
#include <cstdlib>

using namespace std;

void decrypt1(int &a)
{
	a = a+10-7;
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

	cout << "Please input a four-digit number to decrypt." << endl;
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

	swap(a,c);
	swap(b,d);

	decrypt1(a);
	decrypt1(b);
	decrypt1(c);
	decrypt1(d);

	// Output
	cout << "The decrypted number is " << a << b << c << d << "." << endl;

	system("pause");

	return 0;
}