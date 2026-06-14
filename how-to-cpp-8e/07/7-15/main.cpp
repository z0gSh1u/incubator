#include <iostream>
#include <cstdlib>

using namespace std;

int main()
{
	int book[20]={0};
	bool cf=false;
	int t,k=0;
	for (int i=0; i<=19; i++)
	{
		cin >> t;
		for (int j=0; j<=k-1; j++)
			if (t==book[j]) { cf=true; break; }
		if (!cf) { book[k]=t; k++; }
	}
	for (int i=0; i<=k-1; i++)
		cout << book[i];

	system("pause");
	return 0;
}