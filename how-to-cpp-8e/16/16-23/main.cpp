#include <iostream>
#include <cstdlib>

using namespace std;

int main()
{
	int a = 1;
	double b = 2.0;

	try
	{
		throw ( a < b ? a : b );
	}
	catch ( int )
	{
		cout << "int Catch." << endl;
	}
	catch ( double )
	{
		cout << "double Catch." << endl;
	}

	system("pause");
	return 0;
}