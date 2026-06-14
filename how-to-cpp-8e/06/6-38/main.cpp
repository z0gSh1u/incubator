#include <iostream>
#include <cstdlib>

using namespace std;


void Hanoi(int n, char from, char to, char depend)
{
	if (n==1) cout << from << " -> " << to << endl;
	else
	{
		Hanoi(n-1,from,depend,to);
		cout << from << " -> " << to << endl;
		Hanoi(n-1,depend,to,from);
	}
}

int main()
{
	char a='A',b='B',c='C';
	int n;
	cin >> n;
	Hanoi(n,a,c,b);

	system("pause");
	return 0;
}