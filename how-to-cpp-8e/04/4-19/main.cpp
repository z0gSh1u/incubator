#include <iostream>
#include <cstdlib>

using namespace std;

void swap (int &a, int &b)
{
	int tmp;
	tmp=a;
	a=b;
	b=tmp;
}

int main()
{
	int first=0, second=0, input;
	int i=10;
	while (i>0)
	{
		cin >> input;
		if (input>second)
			if (input>first)
			{
				swap(first,second);
				first=input;
			}
			else second=input;
		i--;
	}
	cout << "The largets two number is " << first << " and " << second << "." << endl;
    system("pause");
    return 0;
}