// Bubble Sort
#include <iostream>
#include <cstdlib>
using namespace std;
#define N 10
void mySwap(int &a, int &b)
{
	int c;
	c=a;
	a=b;
	b=c;
}

int main()
{
	int a[N+1];
	for (int i=1; i<=N; i++)
		cin >> a[i];
	for (int i=1; i<=N; i++)
		for (int j=1; j<=N-1; j++)
			if (a[j]>a[j+1]) mySwap(a[j],a[j+1]);
	for (int i=1; i<=N; i++)
		cout << a[i] << ' ';
	system("pause");
	return 0;
}