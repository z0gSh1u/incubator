#include <iostream>
#include <string>
#include <cstdlib>

using namespace std;

int main()
{
	char a[50];
	cin >> a;
	for (int i=strlen(a); i>=0; i--)
		if (!(a[i]=='\0')) cout << a[i];

	system("pause");

	return 0;
}