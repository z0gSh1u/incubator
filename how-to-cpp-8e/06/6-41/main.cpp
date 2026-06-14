#include <iostream>
#include <cstdlib>

using namespace std;

int gcd(int x, int y)
{
	if (y==0) return x;
	return gcd(y,x%y);
}

int main()
{
	int a,b;
	cin >> a >> b;
	if (a>b) cout << gcd(a,b); else cout << gcd(b,a);
	system("pause");
	return 0;
}