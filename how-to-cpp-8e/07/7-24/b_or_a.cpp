/* 7-24 b? a?) */ 

#include <iostream>
#include <cstdlib>

using namespace std;

int board[8][8]={0};
int horizontal[8]={2,1,-1,-2,-2,-1,1,2};
int vertical[8]={-1,-2,-2,-1,1,2,2,1};
int currentRow, currentColumn;

bool canGo(int movetype)
{
	return ( (currentRow + vertical[movetype] < 8 ) && (currentRow + vertical[movetype] >=0 ) &&
		(currentColumn + horizontal[movetype] < 8 ) && (currentColumn + horizontal[movetype] >=0 ) );
}
		 
int main()
{
	for (int i=0; i<=7; i++)
		for (int j=0; j<=7; j++)
		{
			currentRow=i;
			currentColumn=j;
			for (int k=0; k<=7; k++)
				if (canGo(k))
					board[currentRow + vertical[k]][currentColumn + horizontal[k]]++;
		}

	for (int i=0; i<=7; i++)
	{
		for (int j=0; j<=7; j++)
			cout << board[i][j] << ' ';
		cout << endl;
	}
	system("pause");

	return 0;
}