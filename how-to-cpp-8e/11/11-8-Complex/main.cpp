#include "Complex.h"
#include <cstdlib>

using namespace std;

int main()
{
	Complex a;
	cin >> a;
	cout << a;

	Complex b;
	cin >> b;
	cout << b;

	cout << a*b << endl;
	cout << (a==b) << endl;

	system("pause");
	return 0;
}