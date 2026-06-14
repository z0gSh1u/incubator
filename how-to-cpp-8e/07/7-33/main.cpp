#include <iostream>
#include <cstdlib>

using namespace std;

int newLS(const int a[], int n, int size, int key)
{
	if (n==size+1) return -1; 
	if (a[n]==key) return n;
	newLS(a,n+1,size,key);
}

int main()
{
	int a[10]={0,1,2,3,4,5,6,7,8,9};
	int key,size;
	cin >> key >> size;
	cout << newLS(a,0,size,key);
	system("pause");
	return 0;
}