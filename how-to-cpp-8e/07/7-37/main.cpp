#include <iostream>
#include <cstdlib>

using namespace std;

int aa,n;
int a[101];

void init()
{
	cin >> n;
	for (int i=1; i<=n; i++)
		cin >> a[i];
	aa=a[1];
}

int recursiveMinimum(const int a[], int left, int right)
{
	if (left==right) return aa;
	if (a[left]<aa) aa=a[left];
	if (a[right]<aa) aa=a[right];
	recursiveMinimum(a,left+1,right-1);
}

int main()
{
	init();
	cout << recursiveMinimum(a,1,n);
	system("pause");
	return 0;
}