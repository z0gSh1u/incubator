#include <iostream>
#include <vector>
#include <cstdlib>

using namespace std;

int aa,n;
vector <int> vec;

void init()
{
	int tmp;
	cin >> n;
	for (int i=1; i<=n; i++)
	{
		cin >> tmp;
		vec.push_back(tmp);
	}
	aa=vec[0];
}

int recursiveMinimum(const vector <int> a, int left, int right)
{
	if (left>=right) return aa;
	if (a[left]<aa) aa=a[left];
	if (a[right]<aa) aa=a[right];
	return recursiveMinimum(a,left+1,right-1);
}

int main()
{
	init();
	cout << recursiveMinimum(vec,0,n-1);
	system("pause");
	return 0;
}