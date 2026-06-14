#include <iostream>
#include <cstdlib>

using namespace std;

int a[101];
int count;

void readIn()
{
	cout << "Line 1: How many. Line 2: What's them." << endl;
	cin >> count;
	for (int i=1; i<=count; i++)
		cin >> a[i];
}

void mySwap(int &a, int &b)
{
	int t;
	t=a;
	a=b;
	b=t;
}

void selectionSort(int a[], int left, int right)
{
	if (left==right) return;
	int min=left;
	for (int i=left; i<=right; i++)
		if (a[i]<a[min]) min=i;
	mySwap(a[min],a[left]);
	selectionSort(a, left+1, right);
}

void printOut()
{
	for (int i=1; i<=count; i++)
		cout << a[i] << ' ';
}

int main()
{
	readIn();
	selectionSort(a, 1, count);
	printOut();
	system("pause");

	return 0;
}