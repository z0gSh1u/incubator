#include <iostream>
#include <cstdlib>

using namespace std;

void swap(char &a, char &b)
{
	char tmp;
	tmp = a;
	a = b;
	b = tmp;
}

int main()
{
	char a[4];  // ex. 5678 a[0]==5
	cin >> a;

	for (int i=0;i<=3;i++)
		a[i]=(char)(((int)a[i]-48+7)%10+48);

	swap(a[0],a[2]);
	swap(a[1],a[3]);

	cout << a << endl;

	system("pause");
	return 0;
}