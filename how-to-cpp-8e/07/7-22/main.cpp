#include <iostream>
#include <cstdlib>

using namespace std;

int a[5][6];  // a[Saler][Product]

void init()
{
	for (int i=0; i<=4; i++)
		for (int j=0; j<=5; j++)
			a[i][j]=0;
}

void readIn()
{
	cout << "Please input the slips. One line one slip." << endl;
	cout << "Format: [SalerNum] [ProductNum] [SalesPrice]" << endl;
	cout << "Input -1 to symbolize the end of the data." << endl;
	int t1,t2,t3;
	cin >> t1;
	while (t1!=-1)
	{
		cin >> t2 >> t3;
		a[t1][t2]=t3;
		cin >> t1;
	}
}

void calAndPrint()
{
	int line[6]={0}, row[5]={0};
	cout << "\tSaler1\tSaler2\tSaler3\tSaler4\tTotal\n";

	for (int i=1; i<=5; i++)
		for (int j=1; j<=4; j++)
			line[i]+=a[j][i];

	for (int i=1; i<=4; i++)
		for (int j=1; j<=5; j++)
			row[i]+=a[i][j];

	for (int i=1; i<=5; i++)
	{
		cout << endl;
		cout << "Prod" << i << '\t';
		for (int j=1; j<=4; j++)
			cout << a[j][i] << '\t';
		cout << line[i];
	}

	cout << "\nTotal\t";
	for (int i=1; i<=4; i++)
		cout << row[i] << '\t';
	cout << endl;
}


int main()
{
	init();
	readIn();
	calAndPrint();
	system("pause");
	return 0;
}