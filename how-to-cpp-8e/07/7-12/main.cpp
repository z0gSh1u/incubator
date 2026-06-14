// ENHANCED! Bubble Sort
#include <iostream>
#include <cstdlib>
using namespace std;
#define N 10

int a[N+1];

void mySwap(int &a, int &b)
{
	int c;
	c=a;
	a=b;
	b=c;
}

void betterBubbleA()
{
	for (int i=1; i<=N; i++)
		cin >> a[i];
	for (int i=1; i<=N; i++)
		for (int j=1; j<=N-i; j++)
			if (a[j]>a[j+1]) mySwap(a[j],a[j+1]);
	for (int i=1; i<=N; i++)
		cout << a[i] << ' ';
}

void betterBubbleB()
{
	bool flag=false;
	for (int i=1; i<=N; i++)
		cin >> a[i];
	for (int i=1; i<=N; i++)
	{
		flag=false;
		for (int j=1; j<=N-1; j++)
			if (a[j]>a[j+1]) { mySwap(a[j],a[j+1]); flag=true; }
		if (!flag) break;
	}
	for (int i=1; i<=N; i++)
		cout << a[i] << ' ';
}

int main()
{
	betterBubbleA();
	cout << '\n' << endl;
	betterBubbleB();
	system("pause");
	return 0;
}