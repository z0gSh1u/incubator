#include <iostream>
#include <cstdlib>

using namespace std;

union myVar
{
	int a;
	char b;
	float c;
}a,b;

template <typename T> T Maximum (T a, T b)
{
	return a>b ? a : b; 
}

int main()
{
	int n;
	cout << "Enter a number. 1-Int 2-Char 3-Float. ";
	cin >> n;
	switch(n)
	{
	case 1:
		cin >> a.a >> b.a;
		cout << Maximum(a.a,b.a);
		break;
	case 2:
		cin >> a.b >> b.b;
		cout << Maximum(a.b,b.b);
		break;
	case 3:
		cin >> a.c >> b.c;
		cout << Maximum(a.c,b.c);
		break;
	}

	system("pause");
	return 0;
}